export const avoidCircleLabelCollision = (
  labelY,
  circleY,
  { minimum = 18, maximum = Number.POSITIVE_INFINITY, clearance = 34 } = {},
) => {
  if (!Number.isFinite(circleY) || Math.abs(labelY - circleY) >= clearance) {
    return Math.min(maximum, Math.max(minimum, labelY));
  }
  const above = circleY - clearance;
  const below = circleY + clearance;
  return above >= minimum
    ? Math.min(maximum, above)
    : Math.min(maximum, Math.max(minimum, below));
};

export const placeCircleOnBarWhenTallEnough = (
  barTop,
  barHeight,
  radius,
  { minimum = 18, dockDepth = 10, minimumDockableHeight = 64, floatingGap = 8 } = {},
) => {
  if (!Number.isFinite(barTop) || !Number.isFinite(barHeight) || !Number.isFinite(radius)) {
    return null;
  }

  const dockedY = barTop + radius - dockDepth;
  const floatingY = barTop - radius - floatingGap;

  return barHeight >= minimumDockableHeight
    ? Math.max(minimum, dockedY)
    : Math.max(minimum, floatingY);
};
