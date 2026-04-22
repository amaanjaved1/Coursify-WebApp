// CommonJS module for debugging
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createClient } = require('@supabase/supabase-js');

// Use environment variables for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables. Please check your .env file.");
  console.error("Required env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Debug function to inspect database structure
async function debugDatabaseStructure() {
  try {
    console.log("Connected to Supabase URL:", supabaseUrl);
    
    // Get course_distributions structure
    const { data: distData, error: distError } = await supabase
      .from('course_distributions')
      .select('*')
      .limit(1);
      
    if (distError) {
      console.error("Error getting course_distributions:", distError);
    } else if (distData && distData.length > 0) {
      console.log("course_distributions fields:", Object.keys(distData[0]));
      console.log("course_distributions sample:", distData[0]);
    } else {
      console.log("No course_distributions found");
    }
    
    // Get courses structure
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
      
    if (courseError) {
      console.error("Error getting courses:", courseError);
    } else if (courseData && courseData.length > 0) {
      console.log("courses fields:", Object.keys(courseData[0]));
      console.log("courses sample:", courseData[0]);
    } else {
      console.log("No courses found");
    }
    
    // Count the number of courses
    const { count: coursesCount, error: countError } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      console.error("Error counting courses:", countError);
    } else {
      console.log("Total courses count:", coursesCount);
    }
  } catch (e) {
    console.error("Exception in debugDatabaseStructure:", e);
  }
}

// Run the debug function
debugDatabaseStructure()
  .then(() => console.log("Debug complete"))
  .catch(err => console.error("Error:", err)); 