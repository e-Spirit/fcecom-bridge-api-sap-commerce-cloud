const fieldMap = require('../resources/SAPtoFSCreatePageFieldMapping.json');
const errorCauseMap = require('../resources/SAPtoFSErrorCauseMapping.json');
const logger = require('./logger');
const { BodyValidationError, ErrorCode } = require('fcecom-bridge-commons');

const COULD_NOT_MAP_ERROR = 'Could not map error, please check the shop system logs.';
const LOGGING_NAME = 'error-mapper';

const mapErrors = (response) => {
    const method = response.config?.method;
    const errors = response.data?.errors;

    if (method === 'post' || method === 'put') {
        mapCreationErrors(errors);
    } else {
        logger.logError(LOGGING_NAME, COULD_NOT_MAP_ERROR);
    }
};

const mapCreationErrors = (errors) => {
    if (errors && Array.isArray(errors)) {
        let mappedErrors = [];
        mappedErrors = errors.map((err) => {
            return { field: fieldMap[err.subject] || 'unknown', cause: errorCauseMap[err.errorCode] || 'unknown', code: getErrorCode(err) };
        });

        /*
    As SAP Commerce Cloud in some cases shows more than one error for the same issue,
    we need to filter out errors regarding the same field.
    */
        mappedErrors = Array.from(new Set(mappedErrors.map((err) => err.field))).map((field) =>
            mappedErrors.find((err) => err.field === field)
        );

        throw new BodyValidationError('Invalid field in body', { cause: mappedErrors });
    } else {
        logger.logError(LOGGING_NAME, COULD_NOT_MAP_ERROR);
    }
};

const getErrorCode = (sapError) => {
    switch (fieldMap[sapError.subject]) {
        case 'pageUid':
        case 'path':
        case 'label':
            switch (errorCauseMap[sapError.errorCode]) {
                case 'mustBeUnique':
                    return ErrorCode.FIELD_MUST_BE_UNIQUE;
                case 'required':
                    return ErrorCode.FIELD_REQUIRED;
                default:
                    return ErrorCode.UNKNOWN;
            }
        case 'template':
            switch (errorCauseMap[sapError.errorCode]) {
                case 'wrongTemplateMapping':
                    return ErrorCode.TEMPLATE_NOT_MAPPED;
                case 'required':
                    return ErrorCode.FIELD_REQUIRED;
                default:
                    return ErrorCode.UNKNOWN;
            }
        default:
            return ErrorCode.UNKNOWN;
    }
};

module.exports = {
    mapErrors
};
