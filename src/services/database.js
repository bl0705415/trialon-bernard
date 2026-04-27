

import { createClient } from "@supabase/supabase-js";


export const supabase = createClient(
  "https://ceeokkzjugmjckdvjnwf.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlZW9ra3pqdWdtamNrZHZqbndmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNDI4NDEsImV4cCI6MjA5MjgxODg0MX0.rsWTnjLdz-HJDovlSmfjlnhomznUDPhZfLpfDfIU_I4"
);