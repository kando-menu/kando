//////////////////////////////////////////////////////////////////////////////////////////
//                                                                                      //
//     |  /  __|   \ |       _ \   _ \     This file belongs to Ken-Do,                 //
//     . <   _|   .  | ____| |  | (   |    the open-source cross-platform pie menu.     //
//    _|\_\ ___| _|\_|      ___/ \___/     Read more on github.com/ken-do-menu/ken-do   //
//                                                                                      //
//////////////////////////////////////////////////////////////////////////////////////////

// SPDX-FileCopyrightText: Simon Schneegans <code@simonschneegans.de>
// SPDX-License-Identifier: MIT

import "./menu.scss";
import "./theme.scss";

import { computeItemAngles, IVec2 } from "./math";

interface INode {
  name: string;
  icon: string;
  children: Array<INode>;
  angle?: number;
  startAngle?: number;
  endAngle?: number;
  div?: HTMLElement;
}

export class Menu {
  private container: HTMLElement = null;
  private root: INode = null;

  private menuPosition: IVec2 = { x: 0, y: 0 };
  private mousePosition: IVec2 = { x: 0, y: 0 };
  private mouseAngle = 0;
  private mouseDistance = 0;

  private readonly CHILDREN_PER_LEVEL = [8, 5, 3, 3];
  private readonly CENTER_RADIUS = 50;
  private readonly CHILD_DISTANCE = 100;
  private readonly GRANDCHILD_DISTANCE = 25;

  constructor() {
    window.api.log("Menu constructor");

    this.container = document.getElementById("menu");

    this.container.addEventListener("mousemove", (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (this.root) {
        this.mousePosition.x = e.clientX - this.menuPosition.x;
        this.mousePosition.y = e.clientY - this.menuPosition.y;

        this.mouseDistance = Math.sqrt(
          this.mousePosition.x * this.mousePosition.x +
            this.mousePosition.y * this.mousePosition.y
        );
        this.mouseAngle =
          (Math.acos(this.mousePosition.x / this.mouseDistance) * 180) /
          Math.PI;

        if (this.mousePosition.y < 0) {
          this.mouseAngle = 360 - this.mouseAngle;
        }

        // Turn 0° up.
        this.mouseAngle = (this.mouseAngle + 90) % 360;

        this._redraw(this.root, 0);
      }
    });

    this.container.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  public show(position: IVec2) {
    window.api.log(`Menu show at ${position.x}, ${position.y}`);

    this.menuPosition = position;
    this.root = {
      name: "Root",
      icon: "R",
      children: [],
    };

    const addChildren = (parent: INode, level: number) => {
      if (level < this.CHILDREN_PER_LEVEL.length) {
        parent.children = [];
        for (let i = 0; i < this.CHILDREN_PER_LEVEL[level]; ++i) {
          const node: INode = {
            name: `Item ${level}.${i}`,
            icon: `${i}`,
            children: [],
          };
          parent.children.push(node);
          addChildren(node, level + 1);
        }
      }
    };

    addChildren(this.root, 0);

    // Multiply all number in CHILDREN_PER_LEVEL by each other.
    const count = this.CHILDREN_PER_LEVEL.reduce((a, b) => a * b, 1);
    window.api.log(`Created ${count} children!`);

    this.setupAngles(this.root);
    this._createNodeTree(this.root, this.container);

    this._redraw(this.root, 0);
    this.root.div.classList.add("active");

    this.root.div.style.transform = `translate(${this.menuPosition.x}px, ${this.menuPosition.y}px)`;
  }

  hide() {
    window.api.log("Menu hide");

    this.container.innerHTML = "";
    this.root = null;
  }

  // --------------------------------------------------------------------- private methods

  _createNodeTree(node: INode, container: HTMLElement) {
    node.div = document.createElement("div");
    node.div.classList.add("node");

    const item = document.createElement("div");
    item.classList.add("item");
    item.innerHTML = node.icon;

    container.appendChild(node.div);
    node.div.appendChild(item);

    if (node.children) {
      for (const child of node.children) {
        this._createNodeTree(child, node.div);
      }
    }
  }

  _redraw(node: INode, level: number) {
    if (level > 2) {
      return;
    }

    if (level === 0) {
      if (this.mouseDistance > this.CENTER_RADIUS) {
        node.div.classList.remove("hovered");
      } else {
        node.div.classList.add("hovered");
      }
    } else if (level === 1) {
      let transform = "";
      let hovered = false;

      if (this.mouseDistance > this.CENTER_RADIUS) {
        hovered =
          (this.mouseAngle > node.startAngle &&
            this.mouseAngle <= node.endAngle) ||
          (this.mouseAngle - 360 > node.startAngle &&
            this.mouseAngle - 360 <= node.endAngle);

        const angleDiff = Math.abs(node.angle - this.mouseAngle);
        let scale = 1.0 + 0.15 * Math.pow(1 - angleDiff / 180, 4.0);

        if (hovered) {
          scale += 0.05;
        }

        transform = `scale(${scale}) `;
      }

      if (hovered) {
        node.div.classList.add("hovered");
      } else {
        node.div.classList.remove("hovered");
      }

      const x =
        this.CHILD_DISTANCE * Math.cos(((node.angle - 90) * Math.PI) / 180);
      const y =
        this.CHILD_DISTANCE * Math.sin(((node.angle - 90) * Math.PI) / 180);
      transform += `translate(${x}px, ${y}px)`;
      node.div.style.transform = transform;
    } else if (level === 2) {
      const x =
        this.GRANDCHILD_DISTANCE *
        Math.cos(((node.angle - 90) * Math.PI) / 180);
      const y =
        this.GRANDCHILD_DISTANCE *
        Math.sin(((node.angle - 90) * Math.PI) / 180);
      node.div.style.transform = `translate(${x}px, ${y}px)`;
    }

    for (const child of node.children) {
      this._redraw(child, level + 1);
    }
  }

  private setupAngles(node: INode) {
    if (node.children.length === 0) {
      return;
    }

    const angles = computeItemAngles(node.children, (node.angle + 180) % 360);

    for (let i = 0; i < node.children.length; ++i) {
      let previousAngle = angles[(i - 1 + angles.length) % angles.length];
      let nextAngle = angles[(i + 1) % angles.length];

      // Make sure we wrap around.
      if (nextAngle < previousAngle) {
        nextAngle += 360;
      }

      if (angles[i] < previousAngle) {
        nextAngle -= 360;
        previousAngle -= 360;
      }

      const child = node.children[i];
      child.angle = angles[i];
      child.startAngle = (child.angle + previousAngle) / 2;
      child.endAngle = (child.angle + nextAngle) / 2;
      this.setupAngles(child);
    }
  }
}
