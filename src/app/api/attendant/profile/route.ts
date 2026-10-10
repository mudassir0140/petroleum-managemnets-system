import { NextRequest, NextResponse } from "next/server";
import { getEmployeeSession } from "@/lib/employee/session";
import { getDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const attendantId = request.nextUrl.searchParams.get("attendantId");
    const pumpId = request.nextUrl.searchParams.get("pumpId");

    const db = await getDatabase();
    const profileCollection = db.collection("attendant_profiles");

    // Query based on role
    let query: any = {};

    if (session.role === "pump-attendant") {
      // Attendants can only see their own profile
      query = {
        employeeId: new ObjectId(session.employeeId),
        pumpId: session.pumpId ? new ObjectId(session.pumpId) : null,
      };
    } else if (session.role === "pump-owner") {
      // Pump owners can see their pump's employees
      if (!session.pumpId) {
        return NextResponse.json({ error: "Pump ID required" }, { status: 400 });
      }
      query = { pumpId: new ObjectId(session.pumpId) };
      if (attendantId) {
        query.employeeId = new ObjectId(attendantId);
      }
    } else if (session.role === "company-owner" || session.role === "hr-manager") {
      // Admin/HR can see all employees
      if (attendantId && pumpId) {
        query = {
          employeeId: new ObjectId(attendantId),
          pumpId: new ObjectId(pumpId),
        };
      } else if (attendantId) {
        query = { employeeId: new ObjectId(attendantId) };
      }
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await profileCollection.findOne(query);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: profile._id.toString(),
      employeeId: profile.employeeId.toString(),
      pumpId: profile.pumpId?.toString(),
      shifts: profile.shifts || [],
      khataEntries: profile.khataEntries || [],
      totalLitres: profile.totalLitres || 0,
      totalAmount: profile.totalAmount || 0,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    });
  } catch (error) {
    console.error("[AttendantProfile] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getEmployeeSession();
    if (!session || session.role !== "pump-attendant") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(
        { error: "Type and data are required" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const profileCollection = db.collection("attendant_profiles");

    // Find or create profile
    const employeeId = new ObjectId(session.employeeId);
    const pumpId = session.pumpId ? new ObjectId(session.pumpId) : null;

    let profile = await profileCollection.findOne({
      employeeId,
      pumpId,
    });

    if (!profile) {
      const result = await profileCollection.insertOne({
        employeeId,
        pumpId,
        shifts: [],
        khataEntries: [],
        totalLitres: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      profile = await profileCollection.findOne({ _id: result.insertedId });
    }

    // Add data based on type
    if (type === "shift" && profile) {
      await profileCollection.updateOne(
        { _id: profile._id },
        {
          $push: { shifts: { ...data, createdAt: new Date() } },
          $inc: {
            totalLitres: data.litresSold || 0,
            totalAmount: data.amount || 0,
          },
          $set: { updatedAt: new Date() },
        }
      );
    } else if (type === "khata" && profile) {
      await profileCollection.updateOne(
        { _id: profile._id },
        {
          $push: { khataEntries: { ...data, createdAt: new Date() } },
          $inc: { totalAmount: data.amount || 0 },
          $set: { updatedAt: new Date() },
        }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Profile creation failed" },
        { status: 500 }
      );
    }

    const updatedProfile = await profileCollection.findOne({ _id: profile._id });

    if (!updatedProfile) {
      return NextResponse.json(
        { error: "Failed to retrieve updated profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        _id: updatedProfile._id.toString(),
        employeeId: updatedProfile.employeeId.toString(),
        pumpId: updatedProfile.pumpId?.toString(),
        shifts: updatedProfile.shifts,
        khataEntries: updatedProfile.khataEntries,
        totalLitres: updatedProfile.totalLitres,
        totalAmount: updatedProfile.totalAmount,
      },
    });
  } catch (error) {
    console.error("[AttendantProfile] POST error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
