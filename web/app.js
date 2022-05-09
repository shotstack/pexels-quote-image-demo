var apiUrl = 'http://localhost:3000/demo/shotstack'; // 'https://laykyrtz55.execute-api.ap-southeast-2.amazonaws.com/demo/shotstack';
var progress = 0;
var progressIncrement = 10;
var pollIntervalSeconds = 2;
var unknownError = 'An unknown error has occurred. Dispatching minions...';

/**
 * Initialise and show the image
 *
 * @param {String} src  the image URL
 */
function initialiseImage(src) {
    $('#preview').attr('src', src);
    $('#preview').show();
    $('#status').removeClass('d-flex').addClass('d-none');
}

/**
 * Check the render status of the image
 *
 * @param {String} id  the render job UUID
 */
function pollImageStatus(id) {
    $.get(apiUrl + '/' + id, function (response) {
        updateStatus(response.data.status);
        if (!(response.data.status === 'done' || response.data.status === 'failed')) {
            setTimeout(function () {
                pollImageStatus(id);
            }, pollIntervalSeconds * 1000);
        } else if (response.data.status === 'failed') {
            updateStatus(response.data.status);
        } else {
            initialiseImage(response.data.url);
            initialiseJson(response.data.data);
            resetForm();
        }
    });
}

/**
 * Update status message and progress bar
 *
 * @param {String} status  the status text
 */
function updateStatus(status) {
    if (progress <= 90) {
        progress += progressIncrement;
    }

    if (status === 'submitted') {
        $('#status .fas').attr('class', 'fas fa-spinner fa-spin fa-2x');
        $('#status p').text('SUBMITTED');
    } else if (status === 'queued') {
        $('#status .fas').attr('class', 'fas fa-history fa-2x');
        $('#status p').text('QUEUED');
    } else if (status === 'fetching') {
        $('#status .fas').attr('class', 'fas fa-cloud-download-alt fa-2x');
        $('#status p').text('DOWNLOADING ASSETS');
    } else if (status === 'rendering') {
        $('#status .fas').attr('class', 'fas fa-server fa-2x');
        $('#status p').text('RENDERING IMAGE');
    } else if (status === 'saving') {
        $('#status .fas').attr('class', 'fas fa-save fa-2x');
        $('#status p').text('SAVING IMAGE');
    } else if (status === 'done') {
        $('#status .fas').attr('class', 'fas fa-check-circle fa-2x');
        $('#status p').text('READY');
        progress = 100;
    } else {
        $('#status .fas').attr('class', 'fas fa-exclamation-triangle fa-2x');
        $('#status p').text('SOMETHING WENT WRONG');
        $('#submit-image').prop('disabled', false);
        progress = 0;
    }

    $('.progress-bar')
        .css('width', progress + '%')
        .attr('aria-valuenow', progress);
}

/**
 * Display form field and general errors returned by API
 *
 * @param error
 */
function displayError(error) {
    updateStatus(null);

    if (error.status === 400) {
        var response = error.responseJSON;

        if (response.data.isJoi) {
            $.each(response.data.details, function (index, error) {
                if (error.context.key === 'search') {
                    $('#search-group label, #search').addClass('text-danger is-invalid');
                    $('#search-group')
                        .append(
                            '<div class="d-block invalid-feedback">Enter a subject keyword to create a video</div>'
                        )
                        .show();
                }

                if (error.context.key === 'title') {
                    $('#title-group label, #title').addClass('text-danger is-invalid');
                    $('#title-group')
                        .append(
                            '<div class="d-block invalid-feedback">Enter a title for your image</div>'
                        )
                        .show();
                }

                if (error.context.key === 'style') {
                    $('#style-group label, #style').addClass('text-danger is-invalid');
                    $('#style-group')
                        .append(
                            '<div class="d-block invalid-feedback">Please choose a style from the list</div>'
                        )
                        .show();
                }
            });
        } else if (typeof response.data === 'string') {
            $('#errors').text(response.data).removeClass('d-hide').addClass('d-block');
        } else {
            $('#errors').text(unknownError).removeClass('d-hide').addClass('d-block');
        }
    } else {
        $('#errors').text(unknownError).removeClass('d-hide').addClass('d-block');
    }
}

/**
 * Reset errors
 */
function resetErrors() {
    $('input, label, select').removeClass('text-danger is-invalid');
    $('.invalid-feedback').remove();
    $('#errors').text('').removeClass('d-block').addClass('d-hide');
}

/**
 * Reset form
 */
function resetForm() {
    // $('form').trigger('reset');
    $('#submit-image').prop('disabled', false);
}

/**
 * Reset and delete image
 */
function resetImage() {
    progress = 0;
    $('#preview').hide();
    $('#preview').attr('src', '');
    $('.json-container').html('');
    $('#json').hide();
}

/**
 * Submit the form with data to create a Shotstack edit
 */
function submitImageEdit() {
    $('#submit-image').prop('disabled', true);
    $('#instructions').hide();
    $('#status').removeClass('d-none').addClass('d-flex');
    updateStatus('submitted');

    var formData = {
        search: $('#search').val(),
        title: $('#title').val(),
        style: $('#style option:selected').val(),
    };

    $.ajax({
        type: 'POST',
        url: apiUrl,
        data: JSON.stringify(formData),
        dataType: 'json',
        crossDomain: true,
        contentType: 'application/json',
    })
        .done(function (response) {
            if (response.status !== 'success') {
                displayError(response.message);
                $('#submit-image').prop('disabled', false);
            } else {
                pollImageStatus(response.data.id);
            }
        })
        .fail(function (error) {
            displayError(error);
            $('#submit-image').prop('disabled', false);
        });
}

/**
 * Colour and style JSON
 *
 * @param match
 * @param pIndent
 * @param pKey
 * @param pVal
 * @param pEnd
 * @returns {*}
 */
function styleJson(match, pIndent, pKey, pVal, pEnd) {
    var key = '<span class=json-key>"';
    var val = '<span class=json-value>';
    var str = '<span class=json-string>';
    var r = pIndent || '';
    if (pKey) r = r + key + pKey.replace(/[": ]/g, '') + '"</span>: ';
    if (pVal) r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
    return r + (pEnd || '');
}

/**
 * Pretty print JSON object on screen
 *
 * @param obj
 * @returns {string}
 */
function prettyPrintJson(obj) {
    var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/gm;
    return JSON.stringify(obj, null, 3)
        .replace(/&/g, '&amp;')
        .replace(/\\"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(jsonLine, styleJson);
}

/**
 * Show the JSON display button
 *
 * @param json
 */
function initialiseJson(json) {
    $('.json-container').html(prettyPrintJson(json));
    $('#json').show();
}

$(document).ready(function () {
    $('form').submit(function (event) {
        resetErrors();
        resetImage();
        submitImageEdit();

        event.preventDefault();
    });
});
