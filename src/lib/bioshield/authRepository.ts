import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "../supabase"

export interface BioShieldProfile {
  id: string
  email: string
  researcherName: string
  institution: string
  projectId: string
  createdAt: string
  updatedAt: string
}

function mapProfile(row: any): BioShieldProfile {
  return {
    id: row.id,
    email: row.email ?? "",
    researcherName: row.researcher_name ?? "",
    institution: row.institution ?? "",
    projectId: row.project_id ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) throw error

  return session
}

export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    if (error.message.toLowerCase().includes("auth session missing")) {
      return null
    }

    throw error
  }

  return user
}

export async function signUp(
  email: string,
  password: string,
  researcherName: string,
  institution = "",
  projectId = "",
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        researcher_name: researcherName,
        institution,
        project_id: projectId,
      },
    },
  })

  if (error) throw error

  return data
}

export async function signIn(
  email: string,
  password: string,
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (error) throw error

  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw error
}

export async function getProfile(
  userId: string,
): Promise<BioShieldProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) throw error

  if (!data) return null

  return mapProfile(data)
}

export async function updateProfile(
  userId: string,
  updates: {
    researcherName?: string
    institution?: string
    projectId?: string
  },
) {
  const { data, error } = await supabase
    .from("profiles")
    .update({
      researcher_name: updates.researcherName,
      institution: updates.institution,
      project_id: updates.projectId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single()

  if (error) throw error

  return mapProfile(data)
}