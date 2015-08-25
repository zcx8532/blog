var generate = function(content, length) {
  if(!content)
    return content;
  if(!length)
    length = 200;
  return content.length > length ? content.substring(0, length) : content;
}

module.exports.generate = generate;
