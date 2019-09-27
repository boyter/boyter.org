$(document).ready( function () {
    $(".table-1").next().DataTable({
        "paging": false,
        "order": [[ 1, "desc" ]]
    });

    $(".table-2").next().DataTable({
        "paging": false,
        "order": [[ 0, "asc" ]]
    });

    $(".table-3").next().DataTable({
        "paging": false,
        "order": [[ 0, "asc" ]]
    });

    $(".table-4").next().DataTable({
        "paging": false,
        "order": [[ 2, "desc" ]]
    });

    $(".table-5").next().DataTable({
        "paging": false,
        "order": [[ 2, "desc" ]]
    });

    $(".table-6").next().DataTable({
        "paging": false,
        "order": [[ 2, "desc" ]]
    });
});
