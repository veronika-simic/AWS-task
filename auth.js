module.exports = (req, res) => {
  const image = req.files.file.name;

  const array_of_allowed_files = ["png", "jpeg", "jpg", "gif"];

  const allowed_file_size = 2;

  const file_extension = image.slice(((image.lastIndexOf(".") - 1) >>> 0) + 2);

  if (!array_of_allowed_files.includes(file_extension)) {
    throw Error(
      "Invalid file type. Allowed file types are png, jpeg, jpg, and gif"
    );
  }

  if (image.size / (1024 * 1024) > allowed_file_size) {
    throw Error("File too large");
  }
};
