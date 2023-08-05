export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}
export enum MediaType {
  Image,
  Video,
  HLS
}

export enum EncodingStatus {
  Pending, // đang chờ ở hàng đợi (chưa đc encoding )
  Success, // encode xong và thành cong ...
  Processing, // đang encode
  Failed // encode that bại
}

export enum TweetType {
  Tweet,
  ReTweet,
  Comment,
  QuoteTweet
}
export enum TweetAudience {
  EveryOne,
  TwitterCirle
}
