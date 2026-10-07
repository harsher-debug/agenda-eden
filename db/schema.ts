import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
export const calendars = sqliteTable('calendars', {
 id: text('id').primaryKey(), owner: text('owner').notNull().unique(), name: text('name').notNull(),
 service: text('service').notNull(), duration: integer('duration').notNull(), hours: text('hours').notNull(),
 location: text('location').notNull(), active: integer('active').notNull().default(1),
});
export const bookings = sqliteTable('bookings', {
 id: text('id').primaryKey(), calendar: text('calendar').notNull().references(()=>calendars.id),
 date: text('date').notNull(), start: integer('start').notNull(), end: integer('end').notNull(),
 name: text('name').notNull(), email: text('email').notNull(), phone: text('phone').notNull(),
 kind: text('kind').notNull(), created: integer('created').notNull(),
}, table=>[index('idx_bookings_calendar_date').on(table.calendar,table.date)]);
export const locks = sqliteTable('slot_locks', {
 calendar: text('calendar').notNull(), date: text('date').notNull(), minute: integer('minute').notNull(),
 booking: text('booking').notNull().references(()=>bookings.id, {onDelete:'cascade'}),
}, table=>[uniqueIndex('idx_slot_locks_unique').on(table.calendar,table.date,table.minute)]);
