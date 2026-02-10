-- ClassroomX Initial Users
-- Run this in your Supabase SQL Editor AFTER setting up the schema
-- IMPORTANT: Replace 'YourPasswordHere' with your desired common password

-- This script creates all 23 Class 10 students with classroomx.com emails
-- All users will need to change their password on first login

-- Create users using Supabase auth
-- Note: This requires the service role key or admin panel

-- IMPORTANT: You need to run this via Supabase Dashboard or API
-- Go to: Authentication > Users > "Invite user" or use the script below

/*
To create users, use the Supabase Admin API or Dashboard:

1. Via Dashboard:
   - Go to Authentication > Users
   - Click "Add user"
   - Add each user manually with their email and password

2. Via SQL (requires admin function):
   SELECT extensions.create_user(
     'aftab@classroomx.com',
     'YourPasswordHere',
     '{"name": "Aftab"}'
   );
   
3. Via JavaScript (recommended - see users-setup.js):
   Use the Supabase Admin client to create users programmatically
*/

-- List of users to create:
/*
aftab@classroomx.com - Aftab
abaan@classroomx.com - Abaan
saalik@classroomx.com - Saalik
rehan@classroomx.com - Rehan
anas@classroomx.com - Anas
akshita@classroomx.com - Akshita
anushka@classroomx.com - Anushka
nishtha@classroomx.com - Nishtha
bhoomika@classroomx.com - Bhoomika
anushkasinha@classroomx.com - Anushka Sinha
darshana@classroomx.com - Darshana
madhvi@classroomx.com - Madhvi
devishi@classroomx.com - Devishi
chhavi@classroomx.com - Chhavi
yogita@classroomx.com - Yogita
yashi@classroomx.com - Yashi
vidhosi@classroomx.com - Vidhosi
kamal@classroomx.com - Kamal
arjun@classroomx.com - Arjun
aaronbhatt@classroomx.com - Aaron Bhatt
varun@classroomx.com - Varun
vans@classroomx.com - Vans
tanish@classroomx.com - Tanish
*/

-- After users are created via Dashboard/API, you can verify with:
SELECT id, email, created_at FROM auth.users ORDER BY created_at;

-- Verify profiles were created automatically:
SELECT id, name, email, role, is_profile_complete FROM profiles ORDER BY created_at;
