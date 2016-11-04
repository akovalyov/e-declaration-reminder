// ==UserScript==
// @name Test
// @include
// @require jquery.js
// @require jquery.mark.js
// @require data.js
// @require websites.js
// @require doT.js
// ==/UserScript==

var $ = window.$.noConflict(true);

(function ($, db, regex, websites) {
    var hostname = getDomainName(window.location.hostname);
    var context = websites[hostname];

    // Determine selected options
    var options = {
        "each": function (node) {
            var breakout;
            var id = null;
            $.each(db, function (key, value) {
                $.each(value.variants, function (k, val) {
                    var regexp = new RegExp(val.replace("* ", ".? ").replace("*", ".?"));
                    if (node.textContent.match(regexp)) {
                        return breakout = false;
                    }
                });
                if (breakout === false) {
                    id = value.declaration;
                }

                return breakout;
            });

            if (null === id) {
                return;
            }
            var data = kango.storage.getItem(id);

            if (null === data) {
                var details = {
                    method: 'GET',
                    url: 'https://public-api.nazk.gov.ua/v1/declaration/'+id,
                };

                kango.xhr.send(details, function(data) {

                    if (data.status == 200 && data.response != null) {
                        var json = data.response;
                        kango.storage.setItem(id, json);
                        drawToolTip(node, id, kango.storage.getItem(id));
                    }
                    else { // something went wrong
                        kango.console.log('something went wrong');
                    }
                });
            }
            else{
                drawToolTip(node, id, data);
            }
        }
    };
    // kango.console.log(regex);
    $(context).unmark().markRegExp(regex, options);

})($, db, regex, websites);

function drawToolTip(node, id, data){
    kango.xhr.send({
        type: 'GET',
        'url' : 'tooltip.html',
        async: true,
        contentType: 'text'
    }, function(response){
        var template = doT.template(response.response);
        var declaration = JSON.parse(data);

        $(node).append(template(declaration));
    });
}

function getDomainName(domain) {
    var parts = domain.split('.').reverse();
    var cnt = parts.length;
    if (cnt >= 3) {
        // see if the second level domain is a common SLD.
        if (parts[1].match(/^(com|edu|gov|net|mil|org|nom|co|name|info|biz)$/i)) {
            return parts[2] + '.' + parts[1] + '.' + parts[0];
        }
    }
    return parts[1]+'.'+parts[0];
}