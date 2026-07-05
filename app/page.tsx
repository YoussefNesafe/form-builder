import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-[768px] tablet:max-w-[768px] desktop:max-w-[768px] flex-col items-center justify-between py-[128px] tablet:py-[128px] desktop:py-[128px] px-[64px] tablet:px-[64px] desktop:px-[64px] bg-white dark:bg-black tablet:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-[24px] tablet:gap-[24px] desktop:gap-[24px] text-center tablet:items-start tablet:text-left">
          <h1 className="max-w-[320px] tablet:max-w-[320px] desktop:max-w-[320px] text-[30px] tablet:text-[30px] desktop:text-[30px] font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            To get started, edit the page.tsx file.
          </h1>
          <p className="max-w-[448px] tablet:max-w-[448px] desktop:max-w-[448px] text-[18px] tablet:text-[18px] desktop:text-[18px] leading-8 text-zinc-600 dark:text-zinc-400">
            Looking for a starting point or more instructions? Head over to{" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            or the{" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-[16px] tablet:gap-[16px] desktop:gap-[16px] text-[16px] tablet:text-[16px] desktop:text-[16px] font-medium tablet:flex-row">
          <a
            className="flex h-[48px] tablet:h-[48px] desktop:h-[48px] w-full items-center justify-center gap-[8px] tablet:gap-[8px] desktop:gap-[8px] rounded-full bg-foreground px-[20px] tablet:px-[20px] desktop:px-[20px] text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] tablet:w-[158px] desktop:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-[48px] tablet:h-[48px] desktop:h-[48px] w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-[20px] tablet:px-[20px] desktop:px-[20px] transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] tablet:w-[158px] desktop:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}
