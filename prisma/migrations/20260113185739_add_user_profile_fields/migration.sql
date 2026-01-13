-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('VISITOR', 'MEMBER', 'VOTING_MEMBER', 'PRESIDENT', 'VICE_PRESIDENT', 'TREASURER', 'SECRETARY');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "memberStatus" "MemberStatus" NOT NULL DEFAULT 'VISITOR',
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "zip" TEXT;
