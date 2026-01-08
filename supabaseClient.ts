import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mgrjvuuaeptxgluuripd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ncmp2dXVhZXB0eGdsdXVyaXBkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4NDI3NTQsImV4cCI6MjA4MzQxODc1NH0.M7897HooREQXF6-Mv5FuUtR8lp07U5HdoC4ftcklk6k';

export const supabase = createClient(supabaseUrl, supabaseKey);