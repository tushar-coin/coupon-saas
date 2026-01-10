import "./Skeleton.css";

export function Skeleton({ className = "", variant = "rectangular", width, height }) {
  const style = {
    width: width || "100%",
    height: height || (variant === "circular" ? "40px" : "20px"),
  };

  return (
    <div 
      className={`skeleton ${variant} ${className}`}
      style={style}
    />
  );
}

export function TableRowSkeleton({ columns = 7 }) {
  return (
    <tr className="skeleton-row">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i}>
          <Skeleton width={i === 0 ? "60%" : "80%"} />
        </td>
      ))}
    </tr>
  );
}
