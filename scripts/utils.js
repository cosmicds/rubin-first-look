const { writeFile } = require("fs/promises");
const { sep } = require("path");

function updatePackageData(transformation, packageFilepath) {
  if (!packageFilepath) {
    packageFilepath = `${process.cwd()}${sep}package.json`;
  }
  const file = require(packageFilepath);
  const transformed = transformation(file);
  const data = JSON.stringify(transformed, null, 2);
  writeFile(packageFilepath, data);
}

module.exports = {
  updatePackageData
};
