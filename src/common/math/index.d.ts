import { Vec2 } from '../../common';
/** This method returns the the given value clamped to the given range. */
export declare function clamp(value: number, min: number, max: number): number;
/** This method converts radians to degrees. */
export declare function toDegrees(radians: number): number;
/** This method converts degrees to radians. */
export declare function toRadians(degrees: number): number;
/** This method returns the length of the given vector. */
export declare function getLength(vec: Vec2): number;
/** This method normalizes the given vector. */
export declare function normalize(vec: Vec2): Vec2;
/** This method returns the distance between the two given vectors. */
export declare function getDistance(vec1: Vec2, vec2: Vec2): number;
/** This adds two Vec2 together. */
export declare function add(vec1: Vec2, vec2: Vec2): Vec2;
/** This subtracts vec2 from vec1. */
export declare function subtract(vec1: Vec2, vec2: Vec2): Vec2;
/** This multiplies a vector with a scalar. */
export declare function multiply(vec: Vec2, scalar: number): Vec2;
/**
 * This returns the angular difference between the two given angles using the shortest
 * path. The result will always be between 0° and 180°.
 */
export declare function getAngularDifference(angle1: number, angle2: number): number;
/**
 * This method returns the angle which equivalent to the given angle (modulo 360) and
 * closest to the given angle. The result can be negative.
 */
export declare function getClosestEquivalentAngle(angle: number, to: number): number;
/**
 * Returns the largest angle which is equivalent to the given angle (modulo 360) but
 * smaller or equal to the given reference angle.
 */
export declare function getEquivalentAngleSmallerThan(angle: number, than: number): number;
/**
 * Returns the smallest angle which is equivalent to the given angle (modulo 360) but
 * larger or equal to the given reference angle.
 */
export declare function getEquivalentAngleLargerThan(angle: number, than: number): number;
/**
 * This method returns true if the given angle is between the given start and end angles.
 * The angles are in degrees and start should be smaller than end. The method also works
 * if the angle and the start and end angles are negative or larger than 360°.
 *
 * @param angle The angle to check.
 * @param start The start angle.
 * @param end The end angle.
 */
export declare function isAngleBetween(angle: number, start: number, end: number): boolean;
/**
 * This method ensures that the given angles have increasing values. To ensure this, they
 * will be increased or decreased by 360° if necessary. The center angle will be between
 * 0° and 360°. The start angle may be negative and the end angle may be larger than 360°.
 * But their mutual difference will be less than 360°.
 *
 * @param start The first angle.
 * @param center The second angle.
 * @param end The third angle.
 * @returns An array of three angles.
 */
export declare function normalizeConsequtiveAngles(start: number, center: number, end: number): number[];
/**
 * This method returns the angle of the given vector in degrees. 0° is on the top, 90° is
 * on the right, 180° is on the bottom and 270° is on the right. The vector does not need
 * to be normalized.
 */
export declare function getAngle(vec: Vec2): number;
/**
 * This method returns the direction vector for the given angle and length. 0° is on the
 * top, 90° is on the right, 180° is on the bottom and 270° is on the right.
 */
export declare function getDirection(angle: number, length: number): Vec2;
/**
 * Each menu item can have (but not must must have) a fixed angle. If it does not have a
 * fixed angle, it will be automatically computed at run time using the computeItemAngles
 * method below.
 *
 * However, there are some rules for fixed angles in menus. Among sibling items, the angle
 * properties must be monotonically increasing, i.e. the first given angle must be smaller
 * than the second, which must be smaller than the third, and so on. The first given angle
 * must be greater or equal to 0° and all other angles must be smaller than the first
 * given angle plus 360°.
 *
 * This method ensures that these conditions are met. It will increase or decrease all
 * angles by multiples of 360° to ensure that the first angle is between 0° and 360° and
 * all other angles are monotonically increasing. If there are two items with the same
 * angle, the angle of the second one will be removed. Also, any angle which is larger
 * than the first angle plus 360° will be removed.
 *
 * @param items An array of items representing the menu items. Each item can have an
 *   `angle` property which is a number representing the angle in degrees. The array will
 *   be modified in-place.
 */
export declare function fixFixedAngles(items: {
    angle?: number;
}[]): void;
/**
 * This method receives an array of objects, each representing an item in a menu level.
 * For each item it computes an angle defining the direction in which the item should be
 * rendered. The angles are returned in an array of the same length as the input array. If
 * an item in the input array already has an 'angle' property, this is considered a fixed
 * angle and all others are distributed more ore less evenly around. This method also
 * reserves the required angular space for the back navigation link to the parent item (if
 * given). Angles in items are always in degrees, 0° is on the top, 90° on the right, 180°
 * on the bottom and so on. Fixed input angles must be monotonically increasing. If this
 * is not the case, the smaller angle is ignored.
 *
 * @param items The Items for which the angles should be computed. They may already have
 *   an angle property. If so, this is considered a fixed angle.
 * @param parentAngle The angle of the parent item. If given, there will be some reserved
 *   space.
 * @returns An array of angles in degrees.
 */
export declare function computeItemAngles(items: {
    angle?: number;
}[], parentAngle?: number): number[];
/**
 * Computes the start and end angles of the wedges for the given items. The parent angle
 * is optional. If it is given, there will be a gap towards the parent item.
 *
 * @param itemAngles A list of angles for each item. The angles are in degrees and between
 *   0° and 360°.
 * @param parentAngle The angle of the parent item. If given, there will be a gap towards
 *   the parent item. This should be in degrees and between 0° and 360°.
 * @returns A list of start and end angles for each item. Each item in the list
 *   corresponds to the item at the same index in the `itemAngles` list. The start angle
 *   will always be smaller than the end angle. Consequently, the start angle can be
 *   negative and the end angle can be larger than 360°. If a parent angle was given,
 *   there will be an additional `parentWedge` property in the returned object which
 *   contains the start and end angles of the parent wedge.
 */
export declare function computeItemWedges(itemAngles: number[], parentAngle?: number): {
    itemWedges: {
        start: number;
        end: number;
    }[];
    parentWedge?: {
        start: number;
        end: number;
    };
};
/**
 * Given the center coordinates and maximum radius of a menu, this method returns a new
 * position which ensures that the menu and all of its children and grandchildren are
 * inside the current monitor's bounds.
 *
 * @param position The center position of the menu.
 * @param radius The maximum radius of the menu.
 * @param monitorSize The size of the monitor.
 * @returns The clamped position.
 */
export declare function clampToMonitor(position: Vec2, radius: number, monitorSize: Vec2): Vec2;
