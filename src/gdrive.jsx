const Gdrive = ({ src }) => {
  return (
    <div className="gdrive-container">
      <div className="hide-link" />
      <iframe src={src} allowFullScreen />
    </div>
  );
};

export default Gdrive;
