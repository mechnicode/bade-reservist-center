import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from './models/users.js'

dotenv.config()

const promoteToSuperAdmin = async (account) => {
  try {
    await mongoose.connect(process.env.DB_URL)
    const user = await User.findOneAndUpdate({ account }, { role: 2 }, { new: true })
    if (user) {
      console.log(`✅ Success: User "${account}" has been promoted to Super Admin (role: 2).`)
    } else {
      console.log(`❌ Error: User "${account}" not found.`)
    }
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await mongoose.connection.close()
  }
}

const accountName = process.argv[2]
if (!accountName) {
  console.log('Please provide an account name: node promote_super_admin.js <account_name>')
  process.exit(1)
}

promoteToSuperAdmin(accountName)
