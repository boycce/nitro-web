/**
 * @typedef {'af'|'ax'|'al'|'dz'|'as'|'ad'|'ao'|'ai'|'aq'|'ag'|'ar'|'am'|'aw'|'au'|'at'|'az'|'bs'|'bh'|'bd'|'bb'|'by'|'be'|'bz'|
 *  'bj'|'bm'|'bt'|'bo'|'bq'|'ba'|'bw'|'br'|'vg'|'bn'|'bg'|'bf'|'bi'|'cv'|'kh'|'cm'|'ca'|'ky'|'cf'|'td'|'cl'|'cn'|'cx'|
 *  'cc'|'co'|'km'|'cg'|'ck'|'cr'|'ci'|'hr'|'cu'|'cw'|'cy'|'cz'|'cd'|'dk'|'dj'|'dm'|'do'|'ec'|'eg'|'sv'|'gq'|'er'|'ee'|
 *  'sz'|'et'|'fk'|'fo'|'fj'|'fi'|'fr'|'gf'|'pf'|'tf'|'ga'|'gm'|'ge'|'de'|'gh'|'gi'|'gr'|'gl'|'gd'|'gp'|'gu'|'gt'|'gg'|
 *  'gn'|'gw'|'gy'|'ht'|'hm'|'hn'|'hk'|'hu'|'is'|'in'|'id'|'ir'|'iq'|'ie'|'im'|'il'|'it'|'jm'|'jp'|'je'|'jo'|'kz'|'ke'|
 *  'ki'|'kw'|'kg'|'la'|'lv'|'lb'|'ls'|'lr'|'ly'|'li'|'lt'|'lu'|'mo'|'mg'|'mw'|'my'|'mv'|'ml'|'mt'|'mh'|'mq'|'mr'|'mu'|
 *  'yt'|'mx'|'fm'|'md'|'mc'|'mn'|'me'|'ms'|'ma'|'mz'|'mm'|'na'|'nr'|'np'|'nl'|'nc'|'nz'|'ni'|'ne'|'ng'|'nu'|'nf'|'kp'|
 *  'mk'|'mp'|'no'|'om'|'pk'|'pw'|'pa'|'pg'|'py'|'pe'|'ph'|'pn'|'pl'|'pt'|'pr'|'qa'|'re'|'ro'|'ru'|'rw'|'bl'|'sh'|'kn'|
 *  'lc'|'mf'|'pm'|'vc'|'ws'|'sm'|'st'|'sa'|'sn'|'rs'|'sc'|'sl'|'sg'|'sx'|'sk'|'si'|'sb'|'so'|'za'|'gs'|'kr'|'ss'|'es'|
 *  'lk'|'sd'|'sr'|'sj'|'se'|'ch'|'sy'|'tw'|'tj'|'tz'|'th'|'tl'|'tg'|'tk'|'to'|'tt'|'tn'|'tr'|'tm'|'tc'|'tv'|'ug'|'ua'|
 *  'ae'|'gb'|'us'|'um'|'uy'|'vi'|'uz'|'vu'|'va'|'ve'|'vn'|'wf'|'eh'|'ye'|'zm'|'zw'} Country
 * @typedef {'nzd'|'aud'|'usd'|'gbp'|'btc'|'aed'|'ars'|'bdt'|'bhd'|'brl'|'cad'|'chf'|'clp'|'cny'|'cop'|'czk'|'dkk'|'egp'|'eur'|
 *  'hkd'|'huf'|'idr'|'ils'|'inr'|'jod'|'jpy'|'kes'|'krw'|'kwd'|'lkr'|'mad'|'mxn'|'myr'|'ngn'|'nok'|'omr'|'pen'|'php'|'pkr'|
 *  'pln'|'qar'|'ron'|'rub'|'sar'|'sek'|'sgd'|'thb'|'try'|'twd'|'uah'|'vnd'|'zar'} Currency
 */
/** @type {{ [key in Currency]: { name: string, symbol: string, digits: number, flag: string } }} */
export const currencies: { [key in Currency]: {
    name: string;
    symbol: string;
    digits: number;
    flag: string;
}; };
/** @type {{ [key in Country]: { name: string, flag: string } }} */
export const countries: { [key in Country]: {
    name: string;
    flag: string;
}; };
export const countryOptions: {
    value: Country;
    label: string;
    flag: string;
}[];
export const currencyOptions: {
    value: Currency;
    label: string;
    flag: string;
}[];
export type Country = "af" | "ax" | "al" | "dz" | "as" | "ad" | "ao" | "ai" | "aq" | "ag" | "ar" | "am" | "aw" | "au" | "at" | "az" | "bs" | "bh" | "bd" | "bb" | "by" | "be" | "bz" | "bj" | "bm" | "bt" | "bo" | "bq" | "ba" | "bw" | "br" | "vg" | "bn" | "bg" | "bf" | "bi" | "cv" | "kh" | "cm" | "ca" | "ky" | "cf" | "td" | "cl" | "cn" | "cx" | "cc" | "co" | "km" | "cg" | "ck" | "cr" | "ci" | "hr" | "cu" | "cw" | "cy" | "cz" | "cd" | "dk" | "dj" | "dm" | "do" | "ec" | "eg" | "sv" | "gq" | "er" | "ee" | "sz" | "et" | "fk" | "fo" | "fj" | "fi" | "fr" | "gf" | "pf" | "tf" | "ga" | "gm" | "ge" | "de" | "gh" | "gi" | "gr" | "gl" | "gd" | "gp" | "gu" | "gt" | "gg" | "gn" | "gw" | "gy" | "ht" | "hm" | "hn" | "hk" | "hu" | "is" | "in" | "id" | "ir" | "iq" | "ie" | "im" | "il" | "it" | "jm" | "jp" | "je" | "jo" | "kz" | "ke" | "ki" | "kw" | "kg" | "la" | "lv" | "lb" | "ls" | "lr" | "ly" | "li" | "lt" | "lu" | "mo" | "mg" | "mw" | "my" | "mv" | "ml" | "mt" | "mh" | "mq" | "mr" | "mu" | "yt" | "mx" | "fm" | "md" | "mc" | "mn" | "me" | "ms" | "ma" | "mz" | "mm" | "na" | "nr" | "np" | "nl" | "nc" | "nz" | "ni" | "ne" | "ng" | "nu" | "nf" | "kp" | "mk" | "mp" | "no" | "om" | "pk" | "pw" | "pa" | "pg" | "py" | "pe" | "ph" | "pn" | "pl" | "pt" | "pr" | "qa" | "re" | "ro" | "ru" | "rw" | "bl" | "sh" | "kn" | "lc" | "mf" | "pm" | "vc" | "ws" | "sm" | "st" | "sa" | "sn" | "rs" | "sc" | "sl" | "sg" | "sx" | "sk" | "si" | "sb" | "so" | "za" | "gs" | "kr" | "ss" | "es" | "lk" | "sd" | "sr" | "sj" | "se" | "ch" | "sy" | "tw" | "tj" | "tz" | "th" | "tl" | "tg" | "tk" | "to" | "tt" | "tn" | "tr" | "tm" | "tc" | "tv" | "ug" | "ua" | "ae" | "gb" | "us" | "um" | "uy" | "vi" | "uz" | "vu" | "va" | "ve" | "vn" | "wf" | "eh" | "ye" | "zm" | "zw";
export type Currency = "nzd" | "aud" | "usd" | "gbp" | "btc" | "aed" | "ars" | "bdt" | "bhd" | "brl" | "cad" | "chf" | "clp" | "cny" | "cop" | "czk" | "dkk" | "egp" | "eur" | "hkd" | "huf" | "idr" | "ils" | "inr" | "jod" | "jpy" | "kes" | "krw" | "kwd" | "lkr" | "mad" | "mxn" | "myr" | "ngn" | "nok" | "omr" | "pen" | "php" | "pkr" | "pln" | "qar" | "ron" | "rub" | "sar" | "sek" | "sgd" | "thb" | "try" | "twd" | "uah" | "vnd" | "zar";
//# sourceMappingURL=constants.d.ts.map