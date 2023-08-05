export const USER_MESSAGES = {
  VALIDATION_ERROR: 'Validation error',
  EMAIL_ALREADY_EXIST: 'email already exist',
  NAME_IS_REQUIRED: 'name is required',
  NAME_MUST_BE_A_STRING: 'name must be a string',
  NAME_LENGTH_MUST_BE_FROM_1_TO_100: 'NAME_LENGTH_MUST_BE_FROM_1_TO_100',
  EMAIL_IS_REQUIRED: 'EMAIL_IS_REQUIRED',
  EMAIL_IS_INVALID: 'EMAIL_IS_INVALID',
  PASSWORD_IS_REQUIRED: 'password is required ',
  PASSWORD_MUST_BE_STRING: 'password must be a string',
  USER_NOT_FOUND: 'user not found',
  ACCESS_TOKEN_IS_REQUIRED: 'cần truyền access token',
  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'EMAIL_VERIFY_TOKEN_IS_REQUIRED',
  BIO_MUST_BE_STRING: 'bio must be a string ',
  BIO_LENGTH_FROM_TO: 'bio lenght must be from 5 to 200',
  LOCATION_MUST_BE_STRING: 'location must be a string ',
  LOCATION_LENGTH_FROM_TO: 'location lenght must be from 1 to 200',
  WEBSITE_MUST_BE_STRING: 'website must be a string ',
  WEBSITE_LENGTH_FROM_TO: 'website lenght must be from 1 to 200',
  USERNAME_MUST_BE_STRING: 'username must be a string ',
  USERNAME_LENGTH_FROM_TO: 'username lenght must be from 1 to 200',
  IMAGE_URL_MUST_BE_STRING: 'image url must be a string ',
  IMAGE_URL_LENGTH_FROM_TO: 'image url lenght must be from 1 to 200',
  COVER_PHOTO_MUST_BE_STRING: 'cover photo must be a string ',
  COVER_PHOTO_LENGTH_FROM_TO: 'cover photo lenght must be from 1 to 200'
} as const

export const TWEET_MESSAGES = {
  INVALID_TYPE: 'tweet invalid type ',
  INVALID_AUDIENCE: 'tweet invalid audience ',
  PARENT_ID_MUST_BE_A_VALID_TWEET_ID: 'parent id must be valid tweet id',
  CONTENT_MUST_BE_NON_EMPTY_STRING: 'content must be non empty string '
} as const
