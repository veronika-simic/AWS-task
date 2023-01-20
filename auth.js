module.exports = (req, res)  =>  {
  const image = req.files.file.name
  // Array of allowed files
  const array_of_allowed_files = ["png", "jpeg", "jpg", "gif"];
  // Allowed file size in mb
  const allowed_file_size = 2;
  // Get the extension of the uploaded file
  const file_extension = image.slice(
    ((image.lastIndexOf(".") - 1) >>> 0) + 2
  );

  // Check if the uploaded file is allowed
  if (
    !array_of_allowed_files.includes(file_extension)
  ) {
    throw Error("Invalid file type. Allowed file types are png jpeg jpg and gif");
  }

  if (image.size / (1024 * 1024) > allowed_file_size) {
    throw Error("File too large");
  }
};
