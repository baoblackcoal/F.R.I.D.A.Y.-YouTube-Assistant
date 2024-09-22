export function getSearchParam(str: string): { [key: string]: string } {

    const searchParam = (str && str !== "") ? str : window.location.search;

    if (!(/\?([a-zA-Z0-9_]+)/i.exec(searchParam))) return {};
    let match,
        pl     = /\+/g,  // Regex for replacing addition symbol with a space
        search = /([^?&=]+)=?([^&]*)/g,
        decode = function (s: string) { return decodeURIComponent(s.replace(pl, " ")); },
        match1 = /\?([a-zA-Z0-9_]+)/i.exec(searchParam),
        index = match1 ? match1.index + 1 : -1,
        query  = index !== -1 ? searchParam.substring(index) : "";

    // Define the type for urlParams
    interface UrlParams {
        [key: string]: string;
    }

    const urlParams: UrlParams = {};

    while (match = search.exec(query)) {
        urlParams[decode(match[1])] = decode(match[2]);
    }

    return urlParams;
    
}