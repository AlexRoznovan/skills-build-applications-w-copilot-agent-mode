import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { userId, teamId, type, minutes } = payload;

  if (!userId || !teamId || !type || minutes === undefined || minutes === null) {
    throw Object.assign(new Error('userId, teamId, type, and minutes are required'), { status: 400 });
  }

  if (typeof userId !== 'string' || !mongoose.isValidObjectId(userId)) {
    throw Object.assign(new Error('userId must be a valid Mongo object id'), { status: 400 });
  }

  if (typeof teamId !== 'string' || !mongoose.isValidObjectId(teamId)) {
    throw Object.assign(new Error('teamId must be a valid Mongo object id'), { status: 400 });
  }

  if (typeof type !== 'string' || !type.trim()) {
    throw Object.assign(new Error('type is required'), { status: 400 });
  }

  const numericMinutes = Number(minutes);
  if (!Number.isFinite(numericMinutes) || numericMinutes <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 404 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes: numericMinutes,
    points: numericMinutes,
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const payload = input as Record<string, unknown>;
  const { name, mascot, members } = payload;

  if (typeof name !== 'string' || !name.trim()) {
    throw Object.assign(new Error('Team name is required'), { status: 400 });
  }

  if (typeof mascot !== 'string' || !mascot.trim()) {
    throw Object.assign(new Error('Team mascot is required'), { status: 400 });
  }

  const memberIds = Array.isArray(members)
    ? members.map((member) => {
        if (typeof member !== 'string' || !mongoose.isValidObjectId(member)) {
          throw Object.assign(new Error('Each team member must be a valid Mongo object id'), { status: 400 });
        }
        return new mongoose.Types.ObjectId(member);
      })
    : [];

  const team = await Team.create({
    name: name.trim(),
    mascot: mascot.trim(),
    members: memberIds,
  });

  return team.toObject();
}

export async function getLeaderboard() {
  const leaderboard = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $lookup: { from: 'teams', localField: '_id', foreignField: '_id', as: 'team' } },
    { $unwind: '$team' },
    { $project: { _id: 0, teamName: '$team.name', totalPoints: 1 } },
    { $sort: { totalPoints: -1, teamName: 1 } },
  ]);

  return leaderboard.map((entry, index) => ({
    teamName: entry.teamName,
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).lean();

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivity = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentType = recentActivity[0]?.type ?? null;
  const workouts = await Workout.find().lean();

  const preferred = workouts.filter((workout) => {
    const focus = String(workout.focus ?? '').toLowerCase();
    const goal = String(user.fitnessGoal ?? '').toLowerCase();
    const recentFocus = String(recentType ?? '').toLowerCase();
    return focus === goal || focus === recentFocus;
  });

  const suggestions = preferred.length > 0 ? preferred : workouts;

  return suggestions.slice(0, 3).map((workout) => {
    const focus = String(workout.focus ?? '');
    const goal = String(user.fitnessGoal ?? '');
    const recentFocus = String(recentType ?? '');
    const reason = focus === goal
      ? `Matches your ${goal || 'fitness'} goal and recent activity pattern.`
      : focus === recentFocus
        ? `Matches your recent ${recentFocus || 'activity'} pattern.`
        : 'Recommended for your training plan.';

    return {
      ...workout,
      reason,
    };
  });
}

export { User };
