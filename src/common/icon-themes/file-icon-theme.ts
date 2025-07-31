//////////////////////////////////////////////////////////////////////////////////////////
//   _  _ ____ _  _ ___  ____                                                           //
//   |_/  |__| |\ | |  \ |  |    This file belongs to Kando, the cross-platform         //
//   | \_ |  | | \| |__/ |__|    pie menu. Read more on github.com/menu/kando           //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import { matchSorter } from 'match-sorter';

import { IIconTheme } from './icon-theme-registry';
import { IFileIconThemeDescription } from '../../common';

/**
 * This class is used for custom icon themes loaded from a icon-themes directory on the
 * user's file system.
 */
export class FileIconTheme implements IIconTheme {
  /**
   * The cache for SVG icons. This is used to avoid loading the same SVG icon multiple
   * times. SVG icons are treated differently than other icons, as they are injected
   * directly into the DOM to allow for color changes using the "currentColor" property.
   */
  private svgIconCache: Map<string, string> = new Map();

  /**
   * Creates a new FileIconTheme.
   *
   * @param description The description of the icon theme.
   */
  constructor(private description: IFileIconThemeDescription) {}

  /**
   * The name of the icon corresponds to the name of the directory in the icon-themes
   * subdirectory of Kando's config directory.
   */
  get name() {
    return this.description.name;
  }

  /**
   * Creates a div element that contains the icon with the given name.
   *
   * @param icon One of the icons returned by `listIcons`.
   * @returns A div element that contains the icon.
   */
  createIcon(icon: string) {
    const containerDiv = document.createElement('div');
    containerDiv.classList.add('icon-container');

    // If the icon is an SVG, we want to directly embed it into the DOM. This makes it
    // colorable using the "currentColor" fill property. Otherwise, we use an <img> tag to
    // load the icon.
    if (icon.endsWith('.svg')) {
      this.loadAndInjectSvg(`file://${this.description.directory}/${icon}`, containerDiv);
      return containerDiv;
    }

    const iconDiv = document.createElement('img');
    iconDiv.src = `file://${this.description.directory}/${icon}`;
    iconDiv.draggable = false;

    containerDiv.appendChild(iconDiv);

    return containerDiv;
  }

  /** Returns information about the icon picker for this icon theme. */
  get iconPickerInfo() {
    return {
      type: 'list' as const,
      usesTextColor: false,
      listIcons: (searchTerm: string) => {
        return matchSorter(this.description.icons, searchTerm);
      },
    };
  }

  /**
   * As SVG icons are injected directly into the DOM, we need to make sure that nothing
   * clashes between different SVGs. This methods isolated a given SVG content by doing
   * the following:
   *
   * 1. It adds a unique suffix to all IDs in the SVG content.
   * 2. It assigns a unique ID to the <svg> element and uses this ID to scope all CSS styles
   *    in the SVG.
   * 3. It normalizes the viewBox of the SVG content to ensure it scales correctly when
   *    injected into the DOM.
   *
   * @param svgContent The SVG content to normalize.
   * @param uniqueString The unique string used to namespace the SVG content.
   * @returns The namespaced SVG content.
   */
  private isolateSVG(svgContent: string, uniqueString: string) {
    // First step: Add a unique ID to all IDs in the SVG content. ------------------------

    const idRegex = /id="([^"]+)"/g;
    const urlRefRegex = /url\(#([^)]+)\)/g;
    const hrefRegex = /xlink:href="#([^"]+)"/g;

    const idMap = new Map();

    // Find all IDs and map them to new ones.
    svgContent = svgContent.replace(idRegex, (match, id) => {
      const newId = `${id}__${uniqueString}`;
      idMap.set(id, newId);
      return `id="${newId}"`;
    });

    // Replace all references (url(#...), xlink:href="#...").
    svgContent = svgContent.replace(urlRefRegex, (match, id) => {
      const newId = idMap.get(id);
      return newId ? `url(#${newId})` : match;
    });

    svgContent = svgContent.replace(hrefRegex, (match, id) => {
      const newId = idMap.get(id);
      return newId ? `xlink:href="#${newId}"` : match;
    });

    // Second step: Normalize CSS styles in the SVG content. -----------------------------

    // We need to ensure that all styles in the SVG are scoped to the unique ID of the SVG
    // element. This is done by wrapping the styles in a selector that uses the unique ID.

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgEl = doc.documentElement;

    // Add the unique ID to the <svg> element
    const uniqueID = `svg-${uniqueString}`;
    svgEl.setAttribute('id', uniqueID);

    // Find all <style> elements
    const styleElements = svgEl.querySelectorAll('style');

    styleElements.forEach((styleEl) => {
      styleEl.textContent = `#${uniqueID} { ${styleEl.textContent} }`;
    });

    // Third step: Normalize the viewBox of the SVG content. -----------------------------

    // If the SVG already has a viewBox, we remove the width and height attributes. If it
    // doesn't have a viewBox, we create one based on the width and height attributes.
    // This is done to ensure that the SVG scales correctly when injected into the DOM.

    if (svgEl.hasAttribute('viewBox')) {
      // Case 1: Already has viewBox — remove width/height
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
    } else {
      // No viewBox — check for width & height
      const widthAttr = svgEl.getAttribute('width');
      const heightAttr = svgEl.getAttribute('height');

      if (widthAttr && heightAttr) {
        // Strip units (e.g. "100px" → 100)
        const width = parseFloat(widthAttr);
        const height = parseFloat(heightAttr);

        if (!isNaN(width) && !isNaN(height)) {
          svgEl.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }

        svgEl.removeAttribute('width');
        svgEl.removeAttribute('height');
      }
    }

    return new XMLSerializer().serializeToString(svgEl);
  }

  /**
   * Loads an SVG icon from the given path and injects it into the given container
   * element. If the icon is already in the cache, it is loaded from there instead of
   * fetching it again.
   *
   * @param iconPath The path to the SVG icon.
   * @param containerElement The element to inject the SVG into.
   */
  private async loadAndInjectSvg(iconPath: string, containerElement: HTMLElement) {
    if (this.svgIconCache.has(iconPath)) {
      containerElement.innerHTML = this.svgIconCache.get(iconPath);
      return;
    }

    try {
      const response = await fetch(iconPath);
      if (response.ok) {
        let svgContent = await response.text();
        svgContent = this.isolateSVG(svgContent, crypto.randomUUID().slice(-6));
        this.svgIconCache.set(iconPath, svgContent);
        containerElement.innerHTML = svgContent;
      }
    } catch (err) {
      console.error(`Failed to load icon ${iconPath}:`, err);
    }
  }
}
