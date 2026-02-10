import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const CompanySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

const UserSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const ProjectSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    name: { type: String, required: true, trim: true },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const TaskSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true, index: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    assigneeUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    status: { type: String, required: true, enum: ["todo", "in_progress", "done"], index: true },
    order: { type: Number, required: true, default: 0, index: true },

    // Shared cumulative timer
    accumulatedMs: { type: Number, required: true, default: 0 },
    activeUserIds: [{ type: Schema.Types.ObjectId, ref: "User" }], // who is currently "working"
    lastStartAt: { type: Date, default: null }, // when the first active user started (null if none active)
  },
  { timestamps: true }
);

export type Company = InferSchemaType<typeof CompanySchema>;
export type User = InferSchemaType<typeof UserSchema>;
export type Project = InferSchemaType<typeof ProjectSchema>;
export type Task = InferSchemaType<typeof TaskSchema>;

function getModel<T>(name: string, schema: Schema): Model<T> {
  return (mongoose.models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

export const CompanyModel = getModel<Company>("Company", CompanySchema);
export const UserModel = getModel<User>("User", UserSchema);
export const ProjectModel = getModel<Project>("Project", ProjectSchema);
export const TaskModel = getModel<Task>("Task", TaskSchema);

