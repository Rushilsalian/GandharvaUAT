import { LoginForm } from '../LoginForm'

export default function LoginFormExample() {
  return (
    <LoginForm 
      onLogin={(email, password, role) => 
        console.log(`Login as ${role} with ${email}`)
      } 
    />
  )
}