/**
 * @typedef {'af'|'al'|'dz'|'ad'|'ao'|'ag'|'ar'|'am'|'au'|'at'|'az'|'bs'|'bh'|'bd'|'bb'|'by'|'be'|'bz'|'bj'|'bt'|'bo'|'ba'|'bw'|'br'|
 *  'bn'|'bg'|'bf'|'bi'|'cv'|'kh'|'cm'|'ca'|'cf'|'td'|'cl'|'cn'|'co'|'km'|'cg'|'cr'|'hr'|'cu'|'cy'|'cz'|'cd'|'dk'|'dj'|'dm'|'do'|'ec'|
 *  'eg'|'sv'|'gq'|'er'|'ee'|'sz'|'et'|'fj'|'fi'|'fr'|'ga'|'gm'|'ge'|'de'|'gh'|'gr'|'gd'|'gt'|'gn'|'gw'|'gy'|'ht'|'hn'|'hu'|'is'|
 *  'in'|'id'|'ir'|'iq'|'ie'|'il'|'it'|'jm'|'jp'|'jo'|'kz'|'ke'|'ki'|'kw'|'kg'|'la'|'lv'|'lb'|'ls'|'lr'|'ly'|'li'|'lt'|'lu'|'mg'|
 *  'mw'|'my'|'mv'|'ml'|'mt'|'mh'|'mr'|'mu'|'mx'|'fm'|'md'|'mc'|'mn'|'me'|'ma'|'mz'|'mm'|'na'|'nr'|'np'|'nl'|'nz'|'ni'|'ne'|'ng'|
 *  'kp'|'mk'|'no'|'om'|'pk'|'pw'|'pa'|'pg'|'py'|'pe'|'ph'|'pl'|'pt'|'qa'|'ro'|'ru'|'rw'|'kn'|'lc'|'vc'|'ws'|'sm'|'st'|'sa'|'sn'|
 *  'rs'|'sc'|'sl'|'sg'|'sk'|'si'|'sb'|'so'|'za'|'kr'|'ss'|'es'|'lk'|'sd'|'sr'|'se'|'ch'|'sy'|'tj'|'tz'|'th'|'tl'|'tg'|'to'|'tt'|
 *  'tn'|'tr'|'tm'|'tv'|'ug'|'ua'|'ae'|'gb'|'us'|'uy'|'uz'|'vu'|'va'|'ve'|'vn'|'ye'|'zm'|'zw'} Country
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
export type Country = "af" | "al" | "dz" | "ad" | "ao" | "ag" | "ar" | "am" | "au" | "at" | "az" | "bs" | "bh" | "bd" | "bb" | "by" | "be" | "bz" | "bj" | "bt" | "bo" | "ba" | "bw" | "br" | "bn" | "bg" | "bf" | "bi" | "cv" | "kh" | "cm" | "ca" | "cf" | "td" | "cl" | "cn" | "co" | "km" | "cg" | "cr" | "hr" | "cu" | "cy" | "cz" | "cd" | "dk" | "dj" | "dm" | "do" | "ec" | "eg" | "sv" | "gq" | "er" | "ee" | "sz" | "et" | "fj" | "fi" | "fr" | "ga" | "gm" | "ge" | "de" | "gh" | "gr" | "gd" | "gt" | "gn" | "gw" | "gy" | "ht" | "hn" | "hu" | "is" | "in" | "id" | "ir" | "iq" | "ie" | "il" | "it" | "jm" | "jp" | "jo" | "kz" | "ke" | "ki" | "kw" | "kg" | "la" | "lv" | "lb" | "ls" | "lr" | "ly" | "li" | "lt" | "lu" | "mg" | "mw" | "my" | "mv" | "ml" | "mt" | "mh" | "mr" | "mu" | "mx" | "fm" | "md" | "mc" | "mn" | "me" | "ma" | "mz" | "mm" | "na" | "nr" | "np" | "nl" | "nz" | "ni" | "ne" | "ng" | "kp" | "mk" | "no" | "om" | "pk" | "pw" | "pa" | "pg" | "py" | "pe" | "ph" | "pl" | "pt" | "qa" | "ro" | "ru" | "rw" | "kn" | "lc" | "vc" | "ws" | "sm" | "st" | "sa" | "sn" | "rs" | "sc" | "sl" | "sg" | "sk" | "si" | "sb" | "so" | "za" | "kr" | "ss" | "es" | "lk" | "sd" | "sr" | "se" | "ch" | "sy" | "tj" | "tz" | "th" | "tl" | "tg" | "to" | "tt" | "tn" | "tr" | "tm" | "tv" | "ug" | "ua" | "ae" | "gb" | "us" | "uy" | "uz" | "vu" | "va" | "ve" | "vn" | "ye" | "zm" | "zw";
export type Currency = "nzd" | "aud" | "usd" | "gbp" | "btc" | "aed" | "ars" | "bdt" | "bhd" | "brl" | "cad" | "chf" | "clp" | "cny" | "cop" | "czk" | "dkk" | "egp" | "eur" | "hkd" | "huf" | "idr" | "ils" | "inr" | "jod" | "jpy" | "kes" | "krw" | "kwd" | "lkr" | "mad" | "mxn" | "myr" | "ngn" | "nok" | "omr" | "pen" | "php" | "pkr" | "pln" | "qar" | "ron" | "rub" | "sar" | "sek" | "sgd" | "thb" | "try" | "twd" | "uah" | "vnd" | "zar";
//# sourceMappingURL=constants.d.ts.map