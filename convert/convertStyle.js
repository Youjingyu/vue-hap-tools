module.exports = function(styleString){
    return styleString.replace(/\/\*\s*quick\s*app\s*ignore\s*start\s*\*\/(.|\r|\n)*?\/\*\s*quick\s*app\s*ignore\s*end\s*\*\//g, '');
}