import { Database } from "./supabase";

export type GroupData = Database["public"]["Tables"]["groups"]["Row"]

export type EventData = Database["public"]["Tables"]["events"]["Row"]

export type UserData = Database["public"]["Tables"]["users"]["Row"];

export type InterestData = Database["public"]["Tables"]["interests"]["Row"];

export type GroupMembersData = Database["public"]["Tables"]["group-members"]["Row"];

export type EventAttendeesData = Database["public"]["Tables"]["event-attendees"]["Row"];

export type SocialMediaTypes = 'TikTok' | 'Instagram' | 'X' | 'YouTube' | "LinkedIn" | "PersonalWebsite" | "GitHub";

export type PostsData = Database["public"]["Tables"]["posts"]["Row"];

export type GroupPostsData = Database["public"]["Tables"]["group-posts"]["Row"];

export type CommentsData = Database["public"]["Tables"]["post-comments"]["Row"];

export type TicketsData = Database["public"]["Tables"]["event-tickets"]["Row"];

export type AttendeesData = Database["public"]["Tables"]["event-attendees"]["Row"];