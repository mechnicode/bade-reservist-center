import passport from 'passport'
import passportJWT from 'passport-jwt'
import users from '../models/users.js'
import dotenv from 'dotenv'
dotenv.config()

const JwtStrategy = passportJWT.Strategy
const ExtractJwt = passportJWT.ExtractJwt

passport.use(
  'jwt',
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await users.findById(payload._id)
        if (!user) {
          return done(null, false, { message: '使用者不存在' })
        }
        return done(null, user)
      } catch (error) {
        return done(error, false)
      }
    },
  ),
)
