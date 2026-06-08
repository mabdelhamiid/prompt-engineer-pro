// pnpmfile.cjs - pnpm hook configuration
// This file handles patched dependencies and overrides

function readPackage(pkg) {
  // Apply any package modifications here if needed
  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
