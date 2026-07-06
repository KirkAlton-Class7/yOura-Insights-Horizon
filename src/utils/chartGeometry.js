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
