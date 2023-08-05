import { Router } from 'express'
import {
  followController,
  forgotPasswordController,
  getMeController,
  getProfileController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resendVerifyEmailController,
  resetPasswordController,
  unFollowController,
  updateMeController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/users.controllers'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  updateMeValidator,
  verifyForgotPasswordValidator,
  verifyUserValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
usersRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapRequestHandler(logoutController))
/*
   Path : /refresh_token
   Method :  POST
   Body :  { refresh_token :   }
*/
usersRouter.post('/refresh_token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))
/*
  Path :/verify-email 
  Method : POST
  Body : { email_verify_token :string }
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController))
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapRequestHandler(resendVerifyEmailController))

/*
  Path :/forgot-password
  Method : POST
  Body :   {email : string }
*/
// quá trình forgot và reset lại password có 3 bước
// b1 :  /forgot-password
// b2 :  /verify-forgot-password thành công sẽ chuyển tới màn hình nhập new_password và confirm_new_password . nhấn submit
// b3 :  /reset-password sẽ cập nhật password mới và gửi mail
// b1 goi forgot-password tra ve token .để lần sau user gửi new_password có token để verify
usersRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))
// b2 khi user click vào link trong email gọi api này
usersRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)
usersRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

/*
  Description: get my profile
  Path :/me
  Method : POST
  Header :    Authorization Bearer <token>
*/
usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))
// can biết thêm user có verify tài khoản hay chưa
usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifyUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>([
    'avatar',
    'name',
    'bio',
    'date_of_birth',
    'location',
    'website',
    'username',
    'cover_photo'
  ]),
  wrapRequestHandler(updateMeController)
)

/*
  Description: get user profile
  Path :/user0123123123
  Method : GET
*/
usersRouter.get('/:username', wrapRequestHandler(getProfileController))

/*
  Description: Follow user
  Path :/follow
  Method : POST
*/
usersRouter.post('/follow', accessTokenValidator, verifyUserValidator, wrapRequestHandler(followController))
usersRouter.delete(
  '/follow/:follow_user_id',
  accessTokenValidator,
  verifyUserValidator,
  wrapRequestHandler(unFollowController)
)
export default usersRouter
