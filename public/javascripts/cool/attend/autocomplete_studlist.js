$(function () {

  
    var Stud0;
    $.get("tags_stud_list_data.json", function (data) {
        $("#A").autocomplete({ source: data });
    }, "json");
    $.get("tags_staf_list_data.json", function (data) {       
        $("#H").autocomplete({ source: data });
        /*var tags = data;
        $("#H").autocomplete({
            source: function (request, response) {
                var matcher = new RegExp("^" + $.ui.autocomplete.escapeRegex(request.term), "i");
                response($.grep(tags, function (item) {
                    return matcher.test(item);
                }));
            }
        });*/
    }, "json");

    
});