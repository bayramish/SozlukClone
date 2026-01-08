-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ban_reason" TEXT,
ADD COLUMN     "banned_until" TIMESTAMP(3),
ADD COLUMN     "is_banned" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "moderator_permissions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "can_delete_entry" BOOLEAN NOT NULL DEFAULT false,
    "can_delete_topic" BOOLEAN NOT NULL DEFAULT false,
    "can_ban_user" BOOLEAN NOT NULL DEFAULT false,
    "can_edit_entry" BOOLEAN NOT NULL DEFAULT false,
    "can_move_entry" BOOLEAN NOT NULL DEFAULT false,
    "can_merge_topic" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "moderator_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "moderator_permissions_user_id_key" ON "moderator_permissions"("user_id");

-- AddForeignKey
ALTER TABLE "moderator_permissions" ADD CONSTRAINT "moderator_permissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
