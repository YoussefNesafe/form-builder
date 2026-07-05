"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { OtpRuntime } from "../components/FieldRuntime";
import type { OtpVerifiedChecker } from "../core/validation";
import type { FormValues } from "../core/types";

export type OtpFieldHandlers = {
  // Receives the current form values so the handler can read its source
  // field (email, phone, ...). Throw to signal send failure.
  send?: (values: FormValues) => Promise<void>;
  verify?: (code: string) => Promise<boolean>;
};

export type UseOtpControllerOptions = {
  // Per-otp-field handlers, keyed by the otp field's config name — lets one
  // form mix backends (email OTP vs phone OTP).
  fields?: Record<string, OtpFieldHandlers>;
  // Used for otp fields without a map entry.
  fallback?: {
    send?: (fieldName: string, values: FormValues) => Promise<void>;
    verify?: (fieldName: string, code: string) => Promise<boolean>;
  };
};

export type OtpController = {
  // Wire into FieldRuntimeContext (FormRenderer does this automatically).
  otp?: OtpRuntime;
  // Wire into useDynamicForm so validation requires a verified code. Only
  // meaningful when some verify handler exists — see hasVerify.
  otpVerified: OtpVerifiedChecker;
  hasVerify: boolean;
  verifiedFields: ReadonlySet<string>;
};

/**
 * Owns the OTP verified-code registry and its host-API wrappers, decoupled
 * from any form instance: values arrive per send call from the field flow.
 * Invariant: verifiedFields (reactive) always mirrors verifiedCodes (ref)
 * keys — both mutate only inside verify/invalidate below.
 */
export function useOtpController(options: UseOtpControllerOptions): OtpController {
  const { fields, fallback } = options;
  // Codes accepted by a verify handler, keyed by field name. Validation
  // compares the current value against this, so editing a verified code
  // re-invalidates. dep snapshots what the code was verified for
  // (stale-dependency detection across unmounts).
  const verifiedCodes = useRef(new Map<string, { code: string; dep: unknown }>());
  const [verifiedFields, setVerifiedFields] = useState<ReadonlySet<string>>(new Set());

  const otpVerified = useCallback<OtpVerifiedChecker>(
    (fieldName, code) => verifiedCodes.current.get(fieldName)?.code === code,
    [],
  );

  const hasSend = !!fallback?.send || Object.values(fields ?? {}).some((entry) => entry.send);
  const hasVerify = !!fallback?.verify || Object.values(fields ?? {}).some((entry) => entry.verify);

  const otp = useMemo<OtpRuntime | undefined>(() => {
    if (!hasSend && !hasVerify) return undefined;

    const resolveSend = (fieldName: string) => {
      const mapped = fields?.[fieldName]?.send;
      if (mapped) return (values: FormValues) => mapped(values);
      if (fallback?.send) return (values: FormValues) => fallback.send!(fieldName, values);
      return undefined;
    };
    const resolveVerify = (fieldName: string) => {
      const mapped = fields?.[fieldName]?.verify;
      if (mapped) return (code: string) => mapped(code);
      if (fallback?.verify) return (code: string) => fallback.verify!(fieldName, code);
      return undefined;
    };

    return {
      send: hasSend
        ? async (fieldName, values) => {
            const send = resolveSend(fieldName);
            if (!send) {
              // The flow swallows send failures into a generic message —
              // surface the real cause for the developer.
              console.error(`useOtpController: no send handler for otp field "${fieldName}"`);
              throw new Error(`useOtpController: no send handler for otp field "${fieldName}"`);
            }
            await send(values);
          }
        : undefined,
      verify: hasVerify
        ? async (fieldName, code, depValue) => {
            const verify = resolveVerify(fieldName);
            if (!verify) {
              console.error(`useOtpController: no verify handler for otp field "${fieldName}"`);
              throw new Error(`useOtpController: no verify handler for otp field "${fieldName}"`);
            }
            const ok = await verify(code);
            if (ok) {
              verifiedCodes.current.set(fieldName, { code, dep: depValue });
              setVerifiedFields((prev) => new Set(prev).add(fieldName));
            }
            return ok;
          }
        : undefined,
      isVerifiedFor: (fieldName, depValue) => {
        const entry = verifiedCodes.current.get(fieldName);
        return !entry || Object.is(entry.dep, depValue);
      },
      invalidate: (fieldName) => {
        verifiedCodes.current.delete(fieldName);
        setVerifiedFields((prev) => {
          if (!prev.has(fieldName)) return prev;
          const next = new Set(prev);
          next.delete(fieldName);
          return next;
        });
      },
    };
  }, [fields, fallback, hasSend, hasVerify]);

  return { otp, otpVerified, hasVerify, verifiedFields };
}
