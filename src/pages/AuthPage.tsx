import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, saveUsers, setCurrentUser, type User } from "@/lib/store";
import { Car } from "lucide-react";

const AuthPage = () => {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const navigate = useNavigate();

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Signup
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPass, setSignupPass] = useState('');

  const handleLogin = () => {
    const users = getUsers();
    const user = users.find(u => u.email === loginEmail && u.password === loginPass);
    if (user) {
      setCurrentUser(user);
      if (user.role === 'admin') navigate('/carlift-admin');
      else navigate('/');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleSignup = () => {
    if (!signupName || !signupEmail || !signupPhone || !signupPass) { alert('All fields required'); return; }
    const users = getUsers();
    if (users.find(u => u.email === signupEmail)) { alert('User already exists'); return; }
    users.push({ name: signupName, email: signupEmail, phone: signupPhone, password: signupPass, role: 'user' });
    saveUsers(users);
    alert('Signup successful! Please login.');
    setTab('login');
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] px-4 py-12 animate-fade-in-up">
      <div className="glass-card p-8 md:p-10 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <Car className="w-8 h-8 text-primary" />
          <span className="font-display text-2xl font-black gradient-text">CAR LIFT</span>
        </div>

        <div className="flex gap-6 mb-8 border-b border-primary">
          {(['login', 'signup'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-display text-lg pb-3 transition-colors capitalize ${tab === t ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'login' ? 'Login' : 'Sign Up'}
            </button>
          ))}
        </div>

        {tab === 'login' ? (
          <div className="flex flex-col gap-4">
            <input value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email / Username" className="w-full px-4 py-3 bg-input border border-primary/50 rounded-lg text-foreground focus:border-primary focus:outline-none" />
            <input value={loginPass} onChange={e => setLoginPass(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-3 bg-input border border-primary/50 rounded-lg text-foreground focus:border-primary focus:outline-none" />
            <button onClick={handleLogin} className="w-full py-3 bg-gradient-to-r from-primary to-destructive rounded-lg font-bold text-primary-foreground hover:opacity-90 transition-opacity mt-2">Login</button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <input value={signupName} onChange={e => setSignupName(e.target.value)} placeholder="Full Name" className="w-full px-4 py-3 bg-input border border-primary/50 rounded-lg text-foreground focus:border-primary focus:outline-none" />
            <input value={signupEmail} onChange={e => setSignupEmail(e.target.value)} type="email" placeholder="Email" className="w-full px-4 py-3 bg-input border border-primary/50 rounded-lg text-foreground focus:border-primary focus:outline-none" />
            <input value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="WhatsApp Number" className="w-full px-4 py-3 bg-input border border-primary/50 rounded-lg text-foreground focus:border-primary focus:outline-none" />
            <input value={signupPass} onChange={e => setSignupPass(e.target.value)} type="password" placeholder="Password" className="w-full px-4 py-3 bg-input border border-primary/50 rounded-lg text-foreground focus:border-primary focus:outline-none" />
            <button onClick={handleSignup} className="w-full py-3 bg-gradient-to-r from-primary to-destructive rounded-lg font-bold text-primary-foreground hover:opacity-90 transition-opacity mt-2">Create Account</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
