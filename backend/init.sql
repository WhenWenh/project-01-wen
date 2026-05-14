-- USERS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

CREATE INDEX IF NOT EXISTS idx_users_created_at
    ON users(created_at);

-- LOGIN TOKENS
CREATE TABLE IF NOT EXISTS login_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_login_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_login_tokens_user_id
    ON login_tokens(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_login_tokens_token
    ON login_tokens(token);

-- SESSIONS
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jti UUID NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    token TEXT NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_sessions_jti ON sessions(jti);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active ON sessions(user_id, revoked);

-- TOURS
CREATE TABLE IF NOT EXISTS tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    image_path TEXT,
    tour_type VARCHAR(20) NOT NULL,
    start_name TEXT NOT NULL,
    end_name TEXT NOT NULL,
    CONSTRAINT fk_tours_user
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_tour_type
    CHECK (tour_type IN ('BIKE','HIKE','RUNNING','VACATION'))
    );

CREATE INDEX IF NOT EXISTS idx_tours_created_by ON tours(created_by);
CREATE INDEX IF NOT EXISTS idx_tours_name ON tours(name);

-- ROUTES
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID UNIQUE NOT NULL,
    distance INTEGER,
    duration INTEGER,
    coordinates JSONB,
    CONSTRAINT fk_routes_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
    );

-- TOUR LOGS
CREATE TABLE IF NOT EXISTS tour_logs (
                                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tour_id UUID NOT NULL,
    created_by UUID NOT NULL,
    date_time TIMESTAMP,

    rating INTEGER CHECK (rating >= 0 AND rating <= 5),
    difficulty INTEGER CHECK (difficulty >= 1 AND difficulty <= 5),
    total_distance INTEGER,
    total_time INTEGER,
    comment TEXT,

    CONSTRAINT fk_tour_logs_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE,

    CONSTRAINT fk_tour_logs_user
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_tour_logs_tour_id ON tour_logs(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_logs_created_by ON tour_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_tour_logs_date_time ON tour_logs(date_time);

-- FAVORITE TOURS
CREATE TABLE IF NOT EXISTS user_favorite_tours (
    user_id UUID NOT NULL,
    tour_id UUID NOT NULL,
    PRIMARY KEY (user_id, tour_id),
    CONSTRAINT fk_user_fav_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_fav_tour
    FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE
    );

CREATE INDEX IF NOT EXISTS idx_user_fav_tour_id ON user_favorite_tours(tour_id);