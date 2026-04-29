import { getSupabaseClient } from "./supabase/client"
import type { GradeDistribution } from "@/types"
import { toGradeDistribution } from "@/lib/course-contracts"

export async function getCourseDistributions(courseId: string, term: string): Promise<GradeDistribution | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('course_distributions')
      .select('*')
      .eq('course_id', courseId)
      .eq('term', term)
      .single();
    if (error || !data) {
      console.error(`Error fetching grade distribution for course ${courseId}, term ${term}:`, error);
      return null;
    }
    return toGradeDistribution(data);
  } catch (error) {
    console.error(`Error in getCourseDistributions:`, error);
    return null;
  }
}
