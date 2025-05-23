const { argv, exit } = require("process");
const { updatePackageData } = require("./utils");

const name = argv[2];
if (!name) {
  console.error("Missing name of new story!");
  exit(1);
}

updatePackageData((data) => {
  data.name = name;
  return data;
});
