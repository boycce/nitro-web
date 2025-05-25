const versionRegex = /"(@nitro-web\/webpack|nitro-web)"\s*:\s*"([~^*><= -]*)([0-9.]+)"/

module.exports.readVersion = function (contents) {
  // This is just for showing the version in the console
  const version = contents.match(versionRegex)?.[3]
  return version
}

module.exports.writeVersion = function (contents, newVersion) {
  return contents.replaceAll(new RegExp(versionRegex, 'g'), (match, packageName, prefix) => {
    return `"${packageName}": "${prefix}${newVersion}"`
  })
}
