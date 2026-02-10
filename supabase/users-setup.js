// ClassroomX User Setup Script
// Run this with: node supabase/users-setup.js
// Requires: npm install @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

// REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS
const supabaseUrl = 'https://jfeeqjvmqinpynjwlazx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZWVxanZtcWlucHluandsYXp4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDY1Nzg5OCwiZXhwIjoyMDg2MjMzODk4fQ.AfX6CIEM2F-sZr-OkWlZazPNaqlqMob6ZDOobxMOdVY' // NEVER commit this!
const commonPassword = 'ChangeMe@123' // The default password all students will use

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

const students = [
    { email: 'aftab@classroomx.com', name: 'Aftab' },
    { email: 'abaan@classroomx.com', name: 'Abaan' },
    { email: 'saalik@classroomx.com', name: 'Saalik' },
    { email: 'rehan@classroomx.com', name: 'Rehan' },
    { email: 'anas@classroomx.com', name: 'Anas' },
    { email: 'akshita@classroomx.com', name: 'Akshita' },
    { email: 'anushka@classroomx.com', name: 'Anushka' },
    { email: 'nishtha@classroomx.com', name: 'Nishtha' },
    { email: 'bhoomika@classroomx.com', name: 'Bhoomika' },
    { email: 'anushkasinha@classroomx.com', name: 'Anushka Sinha' },
    { email: 'darshana@classroomx.com', name: 'Darshana' },
    { email: 'madhvi@classroomx.com', name: 'Madhvi' },
    { email: 'devishi@classroomx.com', name: 'Devishi' },
    { email: 'chhavi@classroomx.com', name: 'Chhavi' },
    { email: 'yogita@classroomx.com', name: 'Yogita' },
    { email: 'yashi@classroomx.com', name: 'Yashi' },
    { email: 'vidhosi@classroomx.com', name: 'Vidhosi' },
    { email: 'kamal@classroomx.com', name: 'Kamal' },
    { email: 'arjun@classroomx.com', name: 'Arjun' },
    { email: 'aaronbhatt@classroomx.com', name: 'Aaron Bhatt' },
    { email: 'varun@classroomx.com', name: 'Varun' },
    { email: 'vans@classroomx.com', name: 'Vans' },
    { email: 'tanish@classroomx.com', name: 'Tanish' },
]

async function createUsers() {
    console.log('🚀 Starting user creation...\n')

    for (const student of students) {
        try {
            const { data, error } = await supabase.auth.admin.createUser({
                email: student.email,
                password: commonPassword,
                email_confirm: true,
                user_metadata: {
                    name: student.name,
                    needs_password_change: true
                }
            })

            if (error) {
                console.error(`❌ Failed to create ${student.name}:`, error.message)
            } else {
                console.log(`✅ Created user: ${student.name} (${student.email})`)
            }

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100))
        } catch (err) {
            console.error(`❌ Error creating ${student.name}:`, err)
        }
    }

    console.log('\n✨ User creation complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Users can now log in with their email and the common password')
    console.log('2. They will be forced to change their password on first login')
    console.log('3. Then they must complete their profile setup')
}

createUsers()
