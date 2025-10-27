import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Home.css";

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="container mt-5">
      <div className="text-center mb-5">
        <h1 className="display-4">Chào mừng đến với trang quản lý giải đấu</h1>
      </div>

      <div className="row">
        <div className="col-md-3 mb-4">
          <Link to="/register-team" className="text-decoration-none">
            <div className="card dashboard-card h-100">
              <div className="card-body text-center">
                <i className="bi bi-person-plus-fill text-primary"></i>
                <h5 className="card-title">Đăng ký đội bóng</h5>
                <p className="card-text">
                  Tiếp nhận hồ sơ đăng ký của các đội bóng mới.
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="col-md-3 mb-4">
          <Link to="/teams" className="text-decoration-none">
            <div className="card dashboard-card h-100">
              <div className="card-body text-center">
                <i className="bi bi-list-ul text-info"></i>
                <h5 className="card-title">Danh sách đội bóng</h5>
                <p className="card-text">
                  Xem và quản lý thông tin các đội bóng đã đăng ký.
                </p>
              </div>
            </div>
          </Link>
        </div>

        {user && user.role === "admin" && (
          <>
            <div className="col-md-3 mb-4">
              <Link to="/admin/schedules" className="text-decoration-none">
                <div className="card dashboard-card h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-calendar-event-fill text-success"></i>
                    <h5 className="card-title">Lập lịch thi đấu</h5>
                    <p className="card-text">
                      Tạo và quản lý lịch thi đấu cho các vòng đấu.
                    </p>
                  </div>
                </div>
              </Link>
            </div>

            <div className="col-md-3 mb-4">
              <Link to="/admin/users" className="text-decoration-none">
                <div className="card dashboard-card h-100">
                  <div className="card-body text-center">
                    <i className="bi bi-people-fill text-danger"></i>
                    <h5 className="card-title">Quản lý người dùng</h5>
                    <p className="card-text">
                      Quản lý tài khoản và phân quyền người dùng.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
