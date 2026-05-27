export const Loader = ({ label = "Loading..." }) => {
  return (
    <div className="users-loading-state" role="status" aria-live="polite">
      <div className="users-spinner"></div>
      {label ? <p>{label}</p> : null}
    </div>
  );
};
