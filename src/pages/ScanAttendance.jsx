import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { markAttendanceByQR } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QrCode } from "lucide-react";

const COOLDOWN_MS = 3000;

function parseQrToSend(decodedText) {
  const trimmed = decodedText.trim();
  if (trimmed.startsWith("{")) {
    try {
      const payload = JSON.parse(trimmed);
      const student_uid = payload.student_uid ?? "";
      const class_id = payload.class_id ?? "";
      const verification_key = payload.verification_key ?? "";
      return `${student_uid}|${class_id}|${verification_key}`;
    } catch {
      return trimmed;
    }
  }
  return trimmed;
}

export default function ScanAttendancePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const scannerRef = useRef(null);
  const lastScannedRef = useRef({ text: "", at: 0 });
  const [cameraError, setCameraError] = useState(null);
  const [scanning, setScanning] = useState(false);

  const isTeacherOrAdmin =
    user?.role === "TEACHER" ||
    user?.role === "ADMIN" ||
    user?.role === "Teacher" ||
    user?.role === "Admin";

  useEffect(() => {
    if (!user) return;
    if (!isTeacherOrAdmin) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [user, isTeacherOrAdmin, navigate]);

  useEffect(() => {
    if (!isTeacherOrAdmin || !user) return;

    let html5QrCode = null;

    async function startScanner() {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setCameraError("No camera found");
          return;
        }
        const cameraId = cameras[0].id;
        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;
        await html5QrCode.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            const now = Date.now();
            if (
              lastScannedRef.current.text === decodedText &&
              now - lastScannedRef.current.at < COOLDOWN_MS
            ) {
              return;
            }
            lastScannedRef.current = { text: decodedText, at: now };

            const toSend = parseQrToSend(decodedText);
            markAttendanceByQR(toSend)
              .then((res) => {
                toast.success(res?.message ?? "Attendance marked successfully");
              })
              .catch((err) => {
                const status = err.response?.status;
                const detail =
                  err.response?.data?.error ??
                  err.response?.data?.detail ??
                  "Failed to mark attendance";
                if (status === 409) {
                  toast.warning("Already marked today");
                } else if (status === 404) {
                  toast.error("Student not found");
                } else {
                  toast.error(detail);
                }
              });
          },
          () => {}
        );
        setScanning(true);
        setCameraError(null);
      } catch (err) {
        console.error("Camera error:", err);
        setCameraError(
          err?.message || "Could not access camera. Check permissions."
        );
      }
    }

    startScanner();
    return () => {
      const scanner = scannerRef.current;
      if (scanner) {
        scanner
          .stop()
          .then(() => {
            scanner.clear();
            scannerRef.current = null;
          })
          .catch(() => {});
      }
    };
  }, [isTeacherOrAdmin, user]);

  if (user && !isTeacherOrAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard">← Dashboard</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Scan student QR
          </CardTitle>
          <CardDescription>
            Point the camera at a student&apos;s QR code to mark attendance for
            today.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {cameraError ? (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
              {cameraError}
            </div>
          ) : (
            <div
              id="qr-reader"
              className="overflow-hidden rounded-lg border bg-muted/30"
            />
          )}
          {scanning && !cameraError && (
            <p className="mt-3 text-xs text-muted-foreground">
              Hold the QR code in front of the camera. Same code will be
              ignored for a few seconds after a successful scan.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
