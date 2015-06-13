function Mangler () {

    var fullStrings = {};
    var longestCommonPrefix = null;

    this.add = function add (str) {
        fullStrings[str] = true;

        if (null === longestCommonPrefix) {
            longestCommonPrefix = str;
        } else {
            var prefix = '';
            for (var i = 0; i < longestCommonPrefix.length && i < str.length; ++i) {
                if (longestCommonPrefix[i] === str[i]) {
                    prefix += str[i];
                } else {
                    break;
                }
            }
            longestCommonPrefix = prefix;
        }

        return this;
    };

    /**
     * TODO: Make sure this function does NOT return the same string
     *       for 2 different input values.
     */
    this.mangle = function mangle (str) {

        if (!longestCommonPrefix) {
            return str;
        }

        if (str.substr(0, longestCommonPrefix.length) === longestCommonPrefix) {
            return str.substr(longestCommonPrefix.length) || str;
        } else {
            return str;
        }
    };
}

module.exports = Mangler;
