const parser = require("./parser");
const util = require("util");

console.log(
  util.inspect(
    parser.parse(`
path/to/*.txt @anshul && @anshulsahni && @saloni[2] || @arpit
path/to/*.txt @anshul && @anshulsahni && @saloni[2] || @arpit
`),
    { showHidden: false, depth: null, colors: true }
  )
);
