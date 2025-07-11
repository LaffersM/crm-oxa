/*
  # Add INSERT policy for profiles table

  1. Security Changes
    - Add policy to allow users to insert their own profile during signup
    - Policy ensures user_id matches the authenticated user's ID

  This fixes the RLS violation error that occurs during user registration.
*/

-- Add policy to allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);