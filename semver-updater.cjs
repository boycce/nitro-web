const versionRegex = /"nitro-web"\s*:\s*"([~^*><= -]*)([0-9.]+)"/

module.exports.readVersion = function (contents) {
  const version = contents.match(versionRegex)?.[2]
  return version
}

module.exports.writeVersion = function (contents, version) {
  const oldVersion = contents.match(versionRegex)
  if (!oldVersion[2]) return contents
  else return contents.replace(versionRegex, `"nitro-web": "${oldVersion[1]}${version}"`)
}
